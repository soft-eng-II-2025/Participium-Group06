import type { CategoryResponseDTO } from "../models/DTOs/CategoryResponseDTO";
import type { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import type { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import type { RoleResponseDTO } from "../models/DTOs/RoleResponseDTO";
import type { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import type { MessageResponseDTO } from "../models/DTOs/MessageResponseDTO";
import type { NotificationDTO } from "../models/DTOs/NotificationDTO";
import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { CreateOfficerRequestDTO } from "../models/DTOs/CreateOfficerRequestDTO";
import { hashPassword } from "./passwordService";
import { Category } from "../models/Category";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Report } from "../models/Report";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { ReportPhoto } from "../models/ReportPhoto";
import { StatusType } from "../models/StatusType";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";
import { NotificationType } from "../models/NotificationType";
import { SenderType } from "../models/SenderType";
import { Chat } from "../models/Chat";
import { ChatResponseDTO } from "../models/DTOs/ChatRespondeDTO";

/* Helper */
function removeNullAttributes<T extends Record<string, any>>(dto: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(dto).filter(
            ([, value]) =>
                value !== null &&
                value !== undefined &&
                (!Array.isArray(value) || value.length > 0)
        )
    ) as Partial<T>;
}

/* ----------- DTO constructors (Response) ----------- */

export function createCategoryDTO(name?: string, reports?: ReportResponseDTO[]): CategoryResponseDTO {
    return removeNullAttributes({ name, reports }) as CategoryResponseDTO;
}

export function createMunicipalityOfficerDTO(
    id: number,
    username?: string,
    email?: string,
    first_name?: string,
    last_name?: string,
    external?: boolean,
    role?: string | null,
    companyName?: string | null
): MunicipalityOfficerResponseDTO {
    return removeNullAttributes({ id, username, email, first_name, last_name, external, role, companyName }) as MunicipalityOfficerResponseDTO;
}

export function createReportDTO(
    id: number | undefined,
    longitude: number,
    latitude: number,
    title: string,
    description: string,
    user: User, 
    category?: CategoryResponseDTO,
    status?: string,
    explanation?: string,
    officer?: MunicipalityOfficerResponseDTO,
    photos?: string[],
    createdAt?: Date,
    chats?: ChatResponseDTO[],
    leadOfficer?: MunicipalityOfficerResponseDTO
): ReportResponseDTO {
    return removeNullAttributes({
        id,
        longitude,
        latitude,
        title,
        description,
        user: mapUserDAOToDTO(user),
        category: category?.name,
        status,
        explanation,
        officer,
        photos,
        createdAt,
        chats,
        leadOfficer
    }) as unknown as ReportResponseDTO;
}

export function createRoleDTO(title?: string, officers?: MunicipalityOfficerResponseDTO[]): RoleResponseDTO {
    return removeNullAttributes({ title, officers }) as RoleResponseDTO;
}

export function createUserDTO(
    username?: string,
    email?: string,
    password?: string | null,
    first_name?: string,
    last_name?: string,
    photo?: string | null,
    telegram_id?: string | null,
    flag_email?: boolean,
    reports?: ReportResponseDTO[],
    verified?: boolean
): UserResponseDTO {
    return removeNullAttributes({
        username,
        email,
        password,
        first_name,
        last_name,
        photo,
        telegram_id,
        flag_email,
        reports,
        verified
    }) as UserResponseDTO;
}

export function createMessageResponseDTO(
    reportId: number,
    chatId: number,
    role_label?: string,
    username?: string,
    content?: string,
    created_at?: Date,
    sender?: SenderType
): MessageResponseDTO {
    return removeNullAttributes({
        reportId,
        chatId,
        role_label,
        username,
        content,
        created_at,
        sender
    }) as MessageResponseDTO;
}

export function createNotificationDTO(
    id: number | undefined,
    user?: UserResponseDTO,
    content?: string,
    type?: NotificationType,
    is_read?: boolean,
    created_at?: Date
): NotificationDTO {
    return removeNullAttributes({
        id,
        user,
        content,
        type,
        is_read,
        created_at
    }) as NotificationDTO;
}

/* ----------- DAO -> Response mappers ----------- */

export function mapCategoryDAOToDTO(categoryDAO: Category): CategoryResponseDTO {
    const dto: CategoryResponseDTO = {
        id: categoryDAO.id,
        name: categoryDAO.name,
    };
    return dto;
}

export function mapMunicipalityOfficerDAOToDTO(officerDAO: MunicipalityOfficer): MunicipalityOfficerResponseDTO {
    return createMunicipalityOfficerDTO(
        officerDAO.id,
        officerDAO.username,
        officerDAO.email,
        officerDAO.first_name,
        officerDAO.last_name,
        officerDAO.external,
        officerDAO.role?.title || null,
        officerDAO.companyName
    );
}

export function mapReportDAOToDTO(reportDAO: Report): ReportResponseDTO {
    return createReportDTO(
        reportDAO.id,
        reportDAO.longitude,
        reportDAO.latitude,
        reportDAO.title,
        reportDAO.description,
        reportDAO.user,
        reportDAO.category ? mapCategoryDAOToDTO(reportDAO.category) : undefined,
        reportDAO.status,
        reportDAO.explanation,
        reportDAO.officer ? mapMunicipalityOfficerDAOToDTO(reportDAO.officer) : undefined,
        reportDAO.photos?.map((p: ReportPhoto) => p.photo),
        reportDAO.createdAt,
        reportDAO.chats?.map((c: Chat) => mapChatDAOToDTO(c)),
        reportDAO.leadOfficer ? mapMunicipalityOfficerDAOToDTO(reportDAO.leadOfficer) : undefined,

    );
}

export function mapRoleDAOToDTO(roleDAO: Role): RoleResponseDTO {
    return createRoleDTO(
        roleDAO.title,
        roleDAO.municipalityOfficer?.map((o: MunicipalityOfficer) => mapMunicipalityOfficerDAOToDTO(o))
    );
}

export function mapUserDAOToDTO(userDAO: User): UserResponseDTO {
    return createUserDTO(
        userDAO.username,
        userDAO.email,
        null,
        userDAO.first_name,
        userDAO.last_name,
        userDAO.photo,
        userDAO.telegram_id,
        userDAO.flag_email,
        userDAO.reports?.map((r: Report) => mapReportDAOToDTO(r)),
        userDAO.verified
    );
}

export function mapMessageDAOToDTO(messageDAO: Message): MessageResponseDTO {
    const reportId = messageDAO?.chat?.report?.id;
    const chatId = messageDAO?.chat?.id;
    const username = messageDAO?.chat?.report?.user?.username;
    const role_label = messageDAO?.chat?.report?.officer?.role?.label;
    return createMessageResponseDTO(
        reportId as any,
        chatId as any,
        role_label,
        username,
        messageDAO.content,
        messageDAO.created_at,
        messageDAO.sender
    );
}

export function mapNotificationDAOToDTO(notificationDAO: Notification): NotificationDTO {
    return createNotificationDTO(
        notificationDAO.id,
        mapUserDAOToDTO(notificationDAO.user),
        notificationDAO.content,
        notificationDAO.type,
        notificationDAO.is_read,
        notificationDAO.created_at
    );
}

export function mapChatDAOToDTO(chatDAO: Chat): ChatResponseDTO {
    const dto: ChatResponseDTO = {
        id: chatDAO.id,
        reportId: chatDAO?.report?.id,
        type: chatDAO.type,
    };
    return dto;
}

/* ----------- Request -> DAO mappers ----------- */

// Nuovo: mappa CreateReportRequest -> Report (DAO)
export function mapCreateReportRequestToDAO(dto: CreateReportRequestDTO): Report {
    const dao = new Report();
    dao.longitude = dto.longitude;
    dao.latitude = dto.latitude;
    dao.title = dto.title;
    dao.description = dto.description;

    dao.user = new User();
    dao.user.id = dto.userId;
    dao.status = StatusType.PendingApproval;
    dao.officer = undefined;
    dao.explanation = "";
    dao.category = new Category();
    dao.category.id = dto.categoryId;

    return dao;
}

// map CreateOfficerRequestDTO to MunicipalityOfficer DAO
export async function mapCreateOfficerRequestDTOToDAO(dto: CreateOfficerRequestDTO): Promise<MunicipalityOfficer> {
    const dao = new MunicipalityOfficer();
    dao.username = dto.username;
    dao.password = await hashPassword(dto.password);
    dao.email = dto.email.toLowerCase();
    dao.first_name = dto.first_name;
    dao.last_name = dto.last_name;
    dao.external = dto.external;
    return dao;
}
