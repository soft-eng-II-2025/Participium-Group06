import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './Report';

@Entity()
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

  @OneToMany(() => Report, (report) => report.user)
  reports!: Report[];
}
