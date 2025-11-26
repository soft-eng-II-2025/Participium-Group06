// src/repositories/NotificationRepository.ts
import { Repository, DataSource } from "typeorm";
import { Notification } from "../models/Notification";
import { NotificationType } from "../models/NotificationType";

export class NotificationRepository {
  protected ormRepository: Repository<Notification>;

  constructor(dataSource: DataSource) {
    this.ormRepository = dataSource.getRepository(Notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.ormRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: number): Promise<Notification | null> {
    return this.ormRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.ormRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findUnreadByUser(userId: number): Promise<Notification[]> {
    return this.ormRepository.find({
      where: { user: { id: userId }, is_read: false },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(notification: Notification): Promise<Notification> {
    notification.is_read = true;
    return this.ormRepository.save(notification);
  }

  async add(notification: Notification): Promise<Notification> {
    return this.ormRepository.save(notification);
  }

  async remove(notification: Notification): Promise<void> {
    await this.ormRepository.remove(notification);
  }
}
