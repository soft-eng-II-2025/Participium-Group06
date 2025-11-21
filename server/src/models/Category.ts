import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Report } from './Report';
import { Role } from './Role';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Report, (report) => report.category)
  reports!: Report[];

  @ManyToMany(() => Role, (role) => role.categories)
  roles!: Role[];
}
