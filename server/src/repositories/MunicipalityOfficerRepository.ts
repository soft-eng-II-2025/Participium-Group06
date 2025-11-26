// src/repositories/MunicipalityOfficerRepository.ts
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Repository, DataSource} from "typeorm";
//import { AppDataSource } from "../data-source";
import {mapMunicipalityOfficerDAOToDTO} from "../services/mapperService";

export class MunicipalityOfficerRepository {
    protected ormRepository: Repository<MunicipalityOfficer>;
    constructor(dataSource: DataSource) {
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

    async findById(id: number): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne({
            where: { id },
            relations: ["role"],
        });
    }

    async findByRoleTitle(roleTitle: string): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find({
            where: { role: { title: roleTitle } },
            relations: ["role"],
        });
    }

    async add(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }

    async update(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }
}
