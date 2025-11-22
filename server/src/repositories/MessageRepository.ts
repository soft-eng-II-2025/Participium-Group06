// src/repositories/MessageRepository.ts
import { Repository, DataSource } from "typeorm";
import { Message } from "../models/Message";

export class MessageRepository {
  protected ormRepository: Repository<Message>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(Message);
  }

  async findAll(): Promise<Message[]> {
    return this.ormRepository.find({
      relations: ['user', 'municipality_officer'],
      order: { created_at: 'ASC' },
    });
  }

  async findById(id: number): Promise<Message | null> {
    return this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'municipality_officer'],
    });
  }

  async findByReport(reportId: number): Promise<Message[]> {
    return this.ormRepository.find({
      where: { report_id: reportId },
      relations: ['user', 'municipality_officer'],
      order: { created_at: 'ASC' },
    });
  }

  async add(message: Message): Promise<Message> {
    return this.ormRepository.save(message);
  }

  async remove(message: Message): Promise<void> {
    await this.ormRepository.remove(message);
  }
}
