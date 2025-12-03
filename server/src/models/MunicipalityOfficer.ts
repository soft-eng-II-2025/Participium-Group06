import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany} from 'typeorm';
import { Role } from './Role';
import { Report } from './Report';

@Entity()
export class MunicipalityOfficer {
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

  @Column()
  external!: boolean;

  @ManyToOne(() => Role, (role) => role.municipalityOfficer, { nullable: true })
  @JoinColumn({ name: 'role' })
  role?: Role;
  
  @OneToMany(() => Report, (report) => report.officer)
  reports!: Report[];
}
