import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,CreateDateColumn } from 'typeorm';
import { NotificationType } from './NotificationType';
import { User } from './User';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: NotificationType, name: 'type' })
  type!: NotificationType;

  @Column({ type: 'text', name: 'content' })
  content!: string;

  @Column({ name: 'is_read', default: false })
  is_read!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}