import { Chat } from "../models/Chat";
import { Repository, DataSource } from "typeorm";
import { ChatType } from "../models/ChatType";

export class ChatRepository {
    protected chatRepository: Repository<Chat>;

    constructor(dataSource: DataSource) {
        this.chatRepository = dataSource.getRepository(Chat);
    }

    async findAllByReportId(reportId: number): Promise<Chat[]> {
        return this.chatRepository.find({
            where: { report: { id: reportId } },
            relations: ["messages", "report"]
        });
    }

    async findById(id: number): Promise<Chat | null> {

        return this.chatRepository
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.report", "report")
            .leftJoinAndSelect("report.user", "user")
            .leftJoinAndSelect("report.officer", "officer")
            .leftJoinAndSelect("officer.role", "officerRole")
            .leftJoinAndSelect("chat.messages", "messages")
            .where("chat.id = :id", { id })
            .getOne();
    }

    async findByReportIdAndType(reportId: number, type: ChatType): Promise<Chat | null> {
        return this.chatRepository
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.report", "report")
            .leftJoinAndSelect("chat.messages", "messages")
            .where("report.id = :reportId", { reportId })
            .andWhere("chat.type = :type", { type })
            .getOne();
    }

    async add(chat: Chat): Promise<Chat> {
        return this.chatRepository.save(chat);
    }

    async remove(chat: Chat): Promise<void> {
        await this.chatRepository.remove(chat);
    }

    async addReportToChatOfficerUser(reportId: number): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.OFFICER_USER;
        chat.report = { id: reportId } as any;
        return this.chatRepository.save(chat);
    }

    async addReportToLeadExternalUser(reportId: number): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.LEAD_EXTERNAL;
        chat.report = { id: reportId } as any;
        return this.chatRepository.save(chat);
    }

}