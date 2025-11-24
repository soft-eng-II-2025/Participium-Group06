// src/repositories/MessageRepository.ts
import { Repository, DataSource } from "typeorm";
import { Message } from "../models/Message";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";

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

  async findMunicipalityOfficerByReport(reportId: number): Promise<MunicipalityOfficer> {
    return this.ormRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.municipality_officer", "municipality_officer")
      .where("message.report_id = :reportId", { reportId })
      .select(["municipality_officer.id", "municipality_officer.name", "municipality_officer.email"])
      .getOne()
      .then(msg => msg?.municipality_officer!);
  }

  async add(message: Message): Promise<Message> {
    return this.ormRepository.save(message);
  }

  async remove(message: Message): Promise<void> {
    await this.ormRepository.remove(message);
  }
}
