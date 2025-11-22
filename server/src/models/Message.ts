import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne,CreateDateColumn } from 'typeorm';
import { User } from './User';
import { MunicipalityOfficer } from './MunicipalityOfficer';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  // Relation vers l'officer (nullable)
  @ManyToOne(() => MunicipalityOfficer, { nullable: false })
  @JoinColumn({ name: 'municipality_officer_id' })
  municipality_officer?: MunicipalityOfficer;

  // Relation vers l'user (nullable)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Report linked to the message 
  @Column({ name: 'report_id', nullable: false })
  report_id!: number;

  // contenu du message
  @Column({ type: 'text', name: 'content' })
  content!: string;

  // date de création
  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'enum', enum: ['USER', 'OFFICER'] })
  sender!: 'USER' | 'OFFICER';

}