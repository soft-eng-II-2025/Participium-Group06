import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { ReportPhoto } from './ReportPhoto';
import { StatusType } from './StatusType';
import { MunicipalityOfficer } from './MunicipalityOfficer';

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

  @Column({
  type: "enum",
  enum: StatusType,
  default: StatusType.PendingApproval, // <- DB default
  })
  status!: StatusType;


  @Column()
  explanation!: string;

  @ManyToOne(() => MunicipalityOfficer, (officer) => officer.reports)
  @JoinColumn({ name: 'officerId' })
  officer?: MunicipalityOfficer;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Category, (category) => category.reports)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @OneToMany(() => ReportPhoto, (photo) => photo.report)
  photos!: ReportPhoto[];
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
