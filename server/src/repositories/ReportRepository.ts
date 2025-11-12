// src/repositories/ReportRepository.ts (invariato rispetto alla versione precedente)

import { Report } from "../models/Report";
import { Repository, DataSource }  from "typeorm";
//import { AppDataSource } from "../data-source";
import { ReportPhoto } from "../models/ReportPhoto";
import { User } from "../models/User";
import { Category } from "../models/Category";

export class ReportRepository {
    protected ormRepository: Repository<Report>;
    protected photoRepository: Repository<ReportPhoto>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Report);
        this.photoRepository = dataSource.getRepository(ReportPhoto);
    }

    async findAll(): Promise<Report[]> {
        return this.ormRepository.find({ relations: ['category', 'photos', 'user'] });
    }

    async findByCategory(categoryId: number): Promise<Report[]> {
        return this.ormRepository.find({
            where: { category: { id: categoryId } },
            relations: ['category', 'photos', 'user']
        });
    }

    async add(report: Report): Promise<Report> {
        const newReport = new Report();
        newReport.longitude = report.longitude;
        newReport.latitude = report.latitude;
        newReport.title = report.title;
        newReport.description = report.description;

        if (report.user && report.user.id) {
            newReport.user = await AppDataSource.getRepository(User).findOneBy({ id: report.user.id }) as User;
            if (!newReport.user) throw new Error("User not found for report creation.");
        }
        if (report.category && report.category.id) {
            newReport.category = await AppDataSource.getRepository(Category).findOneBy({ id: report.category.id }) as Category;
            if (!newReport.category) throw new Error("Category not found for report creation.");
        }

        return this.ormRepository.save(newReport);
    }

    async addPhotosToReport(report: Report, photos: ReportPhoto[]): Promise<ReportPhoto[]> {
        const photosWithReport = photos.map(photo => {
            photo.report = report;
            return photo;
        });
        return this.photoRepository.save(photosWithReport);
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