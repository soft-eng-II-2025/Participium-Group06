// src/repositories/MessageRepository.ts
import { Repository, DataSource } from "typeorm";
import { Message } from "../models/Message";

export class MessageRepository {
    protected ormRepository: Repository<Message>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Message);
    }

    /**
     * Get all messages (rarely used but kept for completeness)
     */
    async findAll(): Promise<Message[]> {
        return this.ormRepository.find({
            relations: ["chat"],
            order: { created_at: "ASC" },
        });
    }

    /**
     * Get a message by ID
     */
    async findById(id: number): Promise<Message | null> {
        return this.ormRepository.findOne({
            where: { id }
        });
    }

    /**
     * Get all messages for a given report
     */
    async findByChatId(chatId: number): Promise<Message[]> {

        return this.ormRepository.find({
            where: { chat: { id: chatId } },
            order: { created_at: "ASC" }, // Assumendo che il campo sia questo nella tua entity
            relations: {
                chat: {
                    report: {
                        user: true,
                        officer: {
                            roles: true
                        },
                        leadOfficer: {
                            roles: true
                        }
                    }
                }
            }
        });

    }

    /**
     * Save a message (create or update)
     */
    async add(message: Message): Promise<Message> {
        return this.ormRepository.save(message);
    }

    /**
     * Remove a message
     */
    async remove(message: Message): Promise<void> {
        await this.ormRepository.remove(message);
    }
}
