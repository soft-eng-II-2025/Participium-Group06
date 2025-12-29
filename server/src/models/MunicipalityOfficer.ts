import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany} from 'typeorm';
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

  @ManyToMany(() => Role, (role) => role.municipalityOfficers)
  @JoinTable({
  name: 'municipality_officer_roles',
  joinColumn: { name: 'municipality_officer_id', referencedColumnName: 'id'
  },
  inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => Report, (report) => report.officer)
  reports!: Report[];

  @OneToMany(() => Report, (report) => report.leadOfficer, { nullable: true })
  leadReports!: Report[];
}
