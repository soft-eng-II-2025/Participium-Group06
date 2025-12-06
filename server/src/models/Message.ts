import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,CreateDateColumn } from 'typeorm';
import { User } from './User';
import { MunicipalityOfficer } from './MunicipalityOfficer';
import { SenderType } from './SenderType';
import { Chat } from './Chat';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', name: 'content' })
  content!: string;

  @Column({ type: "enum", enum: SenderType })
  sender!: SenderType;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Chat, chat => chat.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;
}