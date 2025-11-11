// src/repositories/MunicipalityOfficerRepository.ts
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { DataSource, Repository} from "typeorm";
import {AppDataSource} from "../data-source";

export class MunicipalityOfficerRepository {
    protected ormRepository: Repository<MunicipalityOfficer>;

    constructor(dataSource: DataSource = AppDataSource) {
        this.ormRepository = dataSource.getRepository(MunicipalityOfficer);
    }

    // elenco completo (con join ruolo)
    async findAll(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find({
            relations: ["role"],
        });
    }
    async findByusername(user: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne(
            {
                where: {username: user},
                relations: ['role'],
            }
        );
    }

    // elenco "visibile" per UI assegnazione: esclude l'utente admin
    async findAllVisible(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository
            .createQueryBuilder("u")
            .leftJoinAndSelect("u.role", "role")
            .where("LOWER(u.username) <> :admin", { admin: "admin" })
            .getMany();
    }

    /**
     * NOTA: findOneBy non fa il join con le relazioni.
     * Per caricare anche la relazione role usiamo findOne con relations.
     */
    async findByUsername(username: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne({
            where: { username },
            relations: ["role"],
        });
    }

    async findByEmail(email: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOneBy({ email });
    }

    async add(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }

    async update(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }
}
