import { Report } from "../models/Report";
import { Repository }  from "typeorm";
import  {AppDataSource} from "../data-source";
import { ReportPhoto } from "../models/ReportPhoto";

export class ReportRepository {
    protected ormRepository: Repository<Report>;
    protected photoRepository: Repository<ReportPhoto>;

    constructor() {
        this.ormRepository = AppDataSource.getRepository(Report);
        this.photoRepository = AppDataSource.getRepository(ReportPhoto);
    }
    async findAll(): Promise<Report[]> {
        return this.ormRepository.find({ relations: ['category', 'photos'] });
    }
    async findByCategory(categoryId: number): Promise<Report[]> {
        return this.ormRepository.find({
            where: { category: { id: categoryId } },
            relations: ['category', 'photos']
        });
    }
    async add(report: Report): Promise<Report> {
        return this.ormRepository.save(report);
    }
    async addPhoto(reportPhoto: ReportPhoto): Promise<ReportPhoto> {
        return this.photoRepository.save(reportPhoto);
    }
    async findPhotosByReportId(reportId: number): Promise<ReportPhoto[]> {
        return this.photoRepository.find({
            where: { report: { id: reportId } }
        });
    }
    async remove(report: Report): Promise<void> {
        await this.ormRepository.remove(report);
    }
    async removePhoto(reportPhoto: ReportPhoto): Promise<void> {
        await this.photoRepository.remove(reportPhoto);
    }
    async changeDescription(report: Report, newDescription: string): Promise<Report> {
        report.description = newDescription;
        return this.ormRepository.save(report);
    }
    async changeTitle(report: Report, newTitle: string): Promise<Report> {
        report.title = newTitle;
        return this.ormRepository.save(report);
    }
}
