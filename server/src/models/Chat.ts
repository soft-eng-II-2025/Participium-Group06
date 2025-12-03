import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Report } from "./Report";
import { ChatType } from "./ChatType";
import { Message } from "./Message";

@Entity("chat")
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Report, report => report.chats, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: Report;

  @Column({ type: "enum", enum: ChatType })
  type!: ChatType;

  @OneToMany(() => Message, message => message.chat)
  messages!: Message[];
}
