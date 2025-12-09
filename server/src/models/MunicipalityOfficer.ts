import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
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

  @Column({ type: 'varchar', nullable: true })
  companyName!: string | null;

  @ManyToOne(() => Role, (role) => role.municipalityOfficer, { nullable: true })
  @JoinColumn({ name: 'role' })
  role?: Role;

  @OneToMany(() => Report, (report) => report.officer)
  reports!: Report[];

  @OneToMany(() => Report, (report) => report.leadOfficer, { nullable: true })
  leadReports!: Report[];
}
