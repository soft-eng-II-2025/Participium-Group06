import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './Report';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column( { unique: true } )
  name!: string;

  @OneToMany(() => Report, (report) => report.category)
  reports!: Report[];
}
