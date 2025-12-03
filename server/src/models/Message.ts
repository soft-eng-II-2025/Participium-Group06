import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,CreateDateColumn } from 'typeorm';
import { User } from './User';
import { MunicipalityOfficer } from './MunicipalityOfficer';
import { SenderType } from './SenderType';
import { Chat } from './Chat';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  sender_id!: number;

  @Column()
  receiver_id!: number;

  // contenu du message
  @Column({ type: 'text', name: 'content' })
  content!: string;

  @Column({ type: "enum", enum: SenderType })
  sender!: SenderType;

  // date de création
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Chat, chat => chat.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;
}