import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';

@Entity()
export class MunicipalityOfficer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @ManyToOne(() => Role, (role) => role.municipalityOfficer, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;
}
