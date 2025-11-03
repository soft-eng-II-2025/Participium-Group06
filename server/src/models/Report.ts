import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { ReportPhoto } from './ReportPhoto';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('real')
  longitude!: number;

  @Column('real')
  latitude!: number;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Category, (category) => category.reports)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @OneToMany(() => ReportPhoto, (photo) => photo.report)
  photos!: ReportPhoto[];
}
