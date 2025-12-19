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
            relations: ["roles"],
        });
    }
    async findByusername(user: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne(
            {
                where: {username: user},
                // relations: ['roles'],
            }
        );
    }

    // elenco "visibile" per UI assegnazione: esclude l'utente admin
    async findAllVisible(): Promise<MunicipalityOfficer[]> {
        return this.ormRepository
            .createQueryBuilder("u")
            .leftJoinAndSelect("u.roles", "roles") // a modifier probablement
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
            relations: ["roles"],
        });
    }

    async findByEmail(email: string): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOneBy({ email });
    }

    async findById(id: number): Promise<MunicipalityOfficer | null> {
        return this.ormRepository.findOne({
            where: { id },
            relations: ["roles"],
        });
    }

    async findByRoleTitle(roleTitle: string): Promise<MunicipalityOfficer[]> {
        return this.ormRepository.find({
            where: { roles: { title: roleTitle } },
            relations: ["roles"],
        });
    }

    async add(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }

    async update(municipalityOfficer: MunicipalityOfficer): Promise<MunicipalityOfficer> {
        return this.ormRepository.save(municipalityOfficer);
    }
}
