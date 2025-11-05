import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Report } from './Report';

@Entity()
export class ReportPhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  photo!: string;

  @ManyToOne(() => Report, (report) => report.photos)
  @JoinColumn({ name: 'reportId' })
  report!: Report;
}
