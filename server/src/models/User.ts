import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './Report';

@Entity('app_user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({unique: true})
  username!: string;

  @Column({unique: true})
  email!: string;

  @Column()
  password!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: "text", nullable: true })
  photo?: string | null;


  @Column({ type: "text", nullable: true })
  telegram_id?: string | null;


  @Column({ type: "boolean", default: false })
  flag_email!: boolean;


  @OneToMany(() => Report, (report) => report.user)
  reports!: Report[];
}
