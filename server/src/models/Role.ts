import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MunicipalityOfficer } from './MunicipalityOfficer';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @OneToMany(() => MunicipalityOfficer, (municipalityOfficer) => municipalityOfficer.role)
  municipalityOfficer!: MunicipalityOfficer[];
}
