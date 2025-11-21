// src/repositories/ReportRepository.ts (invariato rispetto alla versione precedente)

import { Report } from "../models/Report";
import { Repository, DataSource }  from "typeorm";
//import { AppDataSource } from "../data-source";
import { ReportPhoto } from "../models/ReportPhoto";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { StatusType } from "../models/StatusType";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";

export class ReportRepository {
    protected ormRepository: Repository<Report>;
    protected photoRepository: Repository<ReportPhoto>;
    protected userRepository: Repository<User>;
    protected categoryRepository: Repository<Category>;

    constructor(dataSource: DataSource) {
        this.ormRepository = dataSource.getRepository(Report);
        this.photoRepository = dataSource.getRepository(ReportPhoto);
        this.userRepository = dataSource.getRepository(User);
        this.categoryRepository = dataSource.getRepository(Category);
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

    async findById(reportId: number): Promise<Report | null> {
        return this.ormRepository.findOne({
            where: { id: reportId },
            relations: ['category', 'photos', 'user', 'officer']
        });
    }

    async findByUserId(userId: number): Promise<Report[]> {
        return this.ormRepository.find({
            where: { user: { id: userId } },
            relations: ['category', 'photos', 'user', 'officer']
        });
    }

     /*
     * Find ONLY approved reports
     */
    async findApproved(): Promise<Report[]> {
        return this.ormRepository.find({
            where: { status: StatusType.Assigned },
            relations: ["user", "category", "photos", "officer"],
            order: { createdAt: "DESC" }
        });
    }
    async findByOfficer(officer: MunicipalityOfficer): Promise<Report[]> {
        return this.ormRepository.find({
            where: { officer: { id: officer.id } },
            relations: ['category', 'photos', 'user', 'officer']
        });
    }

    async add(report: Report): Promise<Report> {
    const newReport = new Report();
    newReport.longitude = report.longitude;
    newReport.latitude = report.latitude;
    newReport.title = report.title;
    newReport.description = report.description;
    newReport.status = report.status ?? StatusType.PendingApproval; // ensure non-null
    newReport.explanation = report.explanation ?? "";

    if (report.user && report.user.id) {
        newReport.user = await this.userRepository.findOneBy({ id: report.user.id }) as User;
        if (!newReport.user) throw new Error("User not found for report creation.");
    }

    if (report.category && report.category.id) {
        newReport.category = await this.categoryRepository.findOneBy({ id: report.category.id }) as Category;
        if (!newReport.category) throw new Error("Category not found for report creation.");
    }

    if (report.officer && report.officer.id) {
    const officer = await this.ormRepository.manager.findOne(MunicipalityOfficer, {
        where: { id: report.officer.id }
    });
    if (!officer) throw new Error("Officer not found for report creation.");
    newReport.officer = officer; // TypeScript knows this is not null now
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

    async update(report: Report): Promise<Report> {
        return this.ormRepository.save(report);
    }
}