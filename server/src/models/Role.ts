import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { MunicipalityOfficer } from './MunicipalityOfficer';
import { Category } from './Category';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  title!: string;

  @Column()
  label!: string;

  @OneToMany(() => MunicipalityOfficer, (municipalityOfficer) => municipalityOfficer.role)
  municipalityOfficer!: MunicipalityOfficer[];

  @ManyToMany(() => Category, (category) => category.roles)
  @JoinTable({
    name: 'role_categories',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories!: Category[];
}
